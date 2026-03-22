package auth

import (
	"errors"
	"github.com/gin-gonic/gin"
	"github.com/groupware/sdk/pkg/response"
)

type Handler struct{ svc *Service }

func NewHandler(svc *Service) *Handler { return &Handler{svc: svc} }

// RegisterRoutes /api/v1/auth 하위 라우트 등록
func (h *Handler) RegisterRoutes(rg *gin.RouterGroup) {
	g := rg.Group("/auth")
	g.POST("/register", h.Register)
	g.POST("/login",    h.Login)
	g.POST("/refresh",  h.Refresh)
	g.POST("/logout",   h.Logout)
}

// POST /auth/register
func (h *Handler) Register(c *gin.Context) {
	var req struct {
		Email       string `json:"email"        binding:"required,email"`
		Password    string `json:"password"     binding:"required,min=6"`
		DisplayName string `json:"display_name" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "VALIDATION_ERROR", err.Error())
		return
	}

	identity, err := h.svc.Register(req.Email, req.Password, req.DisplayName)
	if err != nil {
		if errors.Is(err, ErrUserExists) {
			response.Conflict(c, err.Error())
		} else {
			response.InternalError(c, err.Error())
		}
		return
	}
	response.Created(c, identity)
}

// POST /auth/login
func (h *Handler) Login(c *gin.Context) {
	var req struct {
		Email    string `json:"email"    binding:"required"`
		Password string `json:"password" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "VALIDATION_ERROR", err.Error())
		return
	}

	access, refresh, expiresAt, err := h.svc.Login(req.Email, req.Password)
	if err != nil {
		response.Unauthorized(c, err.Error())
		return
	}
	response.OK(c, gin.H{
		"access_token":  access,
		"refresh_token": refresh,
		"expires_at":    expiresAt,
	})
}

// POST /auth/refresh
func (h *Handler) Refresh(c *gin.Context) {
	var req struct {
		RefreshToken string `json:"refresh_token" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "VALIDATION_ERROR", err.Error())
		return
	}

	access, refresh, expiresAt, err := h.svc.Refresh(req.RefreshToken)
	if err != nil {
		response.Unauthorized(c, err.Error())
		return
	}
	response.OK(c, gin.H{
		"access_token":  access,
		"refresh_token": refresh,
		"expires_at":    expiresAt,
	})
}

// POST /auth/logout
func (h *Handler) Logout(c *gin.Context) {
	token := c.GetHeader("Authorization")
	if len(token) > 7 {
		token = token[7:] // "Bearer " 제거
	}
	h.svc.Logout(token)
	response.OK(c, gin.H{"message": "로그아웃 완료"})
}
