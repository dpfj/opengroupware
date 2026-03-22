package auth

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/groupware/sdk/config"
	"golang.org/x/crypto/bcrypt"
)

// ── 도메인 타입 ────────────────────────────────────────────────

type Identity struct {
	UserID      string
	Email       string
	DisplayName string
	Roles       []string
}

var (
	ErrInvalidCredentials = errors.New("이메일 또는 비밀번호가 올바르지 않습니다")
	ErrTokenExpired       = errors.New("토큰이 만료됐습니다")
	ErrTokenInvalid       = errors.New("유효하지 않은 토큰입니다")
	ErrTokenRevoked       = errors.New("이미 로그아웃된 토큰입니다")
	ErrUserExists         = errors.New("이미 존재하는 이메일입니다")
	ErrUserNotFound       = errors.New("사용자를 찾을 수 없습니다")
)

// ── 내부 저장소 ───────────────────────────────────────────────

type userRecord struct {
	userID      string
	email       string
	displayName string
	pwHash      string
	roles       []string
}

// ── Service ───────────────────────────────────────────────────

type Service struct {
	cfg           config.AuthConfig
	mu            sync.RWMutex
	users         map[string]*userRecord // email → record
	refreshTokens map[string]string      // token → userID
	blacklist     map[string]time.Time   // accessToken → expiry
}

func NewService(cfg config.AuthConfig) *Service {
	return &Service{
		cfg:           cfg,
		users:         make(map[string]*userRecord),
		refreshTokens: make(map[string]string),
		blacklist:     make(map[string]time.Time),
	}
}

// Register 회원가입
func (s *Service) Register(email, password, displayName string) (*Identity, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if _, ok := s.users[email]; ok {
		return nil, ErrUserExists
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("비밀번호 해시 실패: %w", err)
	}

	rec := &userRecord{
		userID:      uuid.New().String(),
		email:       email,
		displayName: displayName,
		pwHash:      string(hash),
		roles:       []string{"workspace.member"},
	}
	s.users[email] = rec

	return &Identity{
		UserID: rec.userID, Email: rec.email,
		DisplayName: rec.displayName, Roles: rec.roles,
	}, nil
}

// Login 로그인 → TokenPair 발급
func (s *Service) Login(email, password string) (accessToken, refreshToken string, expiresAt time.Time, err error) {
	s.mu.RLock()
	rec := s.users[email]
	s.mu.RUnlock()

	// 타이밍 공격 방지: 사용자 없어도 동일 연산
	hash := "$2a$10$invalidhashfortimingattackprevention"
	if rec != nil {
		hash = rec.pwHash
	}
	if bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)) != nil || rec == nil {
		return "", "", time.Time{}, ErrInvalidCredentials
	}

	return s.issueTokenPair(rec)
}

// Verify 액세스 토큰 검증
func (s *Service) Verify(tokenStr string) (*Identity, error) {
	// 블랙리스트 확인
	s.mu.RLock()
	exp, revoked := s.blacklist[tokenStr]
	s.mu.RUnlock()
	if revoked && time.Now().Before(exp) {
		return nil, ErrTokenRevoked
	}

	claims, err := s.parseClaims(tokenStr)
	if err != nil {
		return nil, err
	}

	return &Identity{
		UserID:      claims["sub"].(string),
		Email:       claims["email"].(string),
		DisplayName: claims["name"].(string),
		Roles:       toStringSlice(claims["roles"]),
	}, nil
}

// Refresh 토큰 갱신 (Rotation)
func (s *Service) Refresh(refreshToken string) (accessToken, newRefresh string, expiresAt time.Time, err error) {
	s.mu.Lock()
	userID, ok := s.refreshTokens[refreshToken]
	if ok {
		delete(s.refreshTokens, refreshToken) // 즉시 제거 (Rotation)
	}
	s.mu.Unlock()

	if !ok {
		return "", "", time.Time{}, ErrTokenInvalid
	}

	s.mu.RLock()
	var rec *userRecord
	for _, r := range s.users {
		if r.userID == userID {
			rec = r
			break
		}
	}
	s.mu.RUnlock()

	if rec == nil {
		return "", "", time.Time{}, ErrUserNotFound
	}
	return s.issueTokenPair(rec)
}

// Logout 액세스 토큰 블랙리스트 등록
func (s *Service) Logout(accessToken string) error {
	claims, err := s.parseClaims(accessToken)
	if err != nil {
		return err
	}
	exp := time.Unix(int64(claims["exp"].(float64)), 0)

	s.mu.Lock()
	s.blacklist[accessToken] = exp
	s.mu.Unlock()
	return nil
}

// ── 내부 헬퍼 ─────────────────────────────────────────────────

func (s *Service) issueTokenPair(rec *userRecord) (string, string, time.Time, error) {
	now := time.Now()
	expiresAt := now.Add(s.cfg.AccessTokenTTL)

	claims := jwt.MapClaims{
		"sub":   rec.userID,
		"email": rec.email,
		"name":  rec.displayName,
		"roles": rec.roles,
		"iat":   now.Unix(),
		"exp":   expiresAt.Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString([]byte(s.cfg.JWTSecret))
	if err != nil {
		return "", "", time.Time{}, err
	}

	// Refresh Token: HMAC 기반 랜덤값
	raw := uuid.New().String() + uuid.New().String()
	mac := hmac.New(sha256.New, []byte(s.cfg.JWTSecret))
	mac.Write([]byte(raw))
	refresh := hex.EncodeToString(mac.Sum(nil)) + raw[:16]

	s.mu.Lock()
	s.refreshTokens[refresh] = rec.userID
	s.mu.Unlock()

	return signed, refresh, expiresAt, nil
}

func (s *Service) parseClaims(tokenStr string) (jwt.MapClaims, error) {
	token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, ErrTokenInvalid
		}
		return []byte(s.cfg.JWTSecret), nil
	})
	if err != nil {
		if errors.Is(err, jwt.ErrTokenExpired) {
			return nil, ErrTokenExpired
		}
		return nil, ErrTokenInvalid
	}
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok || !token.Valid {
		return nil, ErrTokenInvalid
	}
	return claims, nil
}

func toStringSlice(v interface{}) []string {
	if v == nil {
		return nil
	}
	arr, ok := v.([]interface{})
	if !ok {
		return nil
	}
	out := make([]string, 0, len(arr))
	for _, a := range arr {
		if s, ok := a.(string); ok {
			out = append(out, s)
		}
	}
	return out
}
