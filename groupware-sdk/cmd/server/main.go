package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-contrib/requestid"
	"github.com/gin-gonic/gin"
	"github.com/groupware/sdk/config"
	"github.com/groupware/sdk/internal/approval"
	"github.com/groupware/sdk/internal/auth"
	mw "github.com/groupware/sdk/internal/middleware"
	"github.com/groupware/sdk/pkg/logger"
	"github.com/groupware/sdk/pkg/response"
	"go.uber.org/zap"
)

func main() {
	// ── 설정 로드 ─────────────────────────────────────────
	cfg, err := config.Load()
	if err != nil {
		fmt.Fprintf(os.Stderr, "설정 로드 실패: %v\n", err)
		os.Exit(1)
	}

	// ── 로거 초기화 ───────────────────────────────────────
	logger.Init(cfg.Log.Level, cfg.Log.Format)
	log := logger.Get()
	defer log.Sync()

	log.Info("Groupware SDK 서버 시작",
		zap.String("port", cfg.Server.Port),
		zap.String("mode", cfg.Server.Mode),
	)

	// ── Gin 설정 ──────────────────────────────────────────
	gin.SetMode(cfg.Server.Mode)
	r := gin.New()

	// ── 미들웨어 ──────────────────────────────────────────
	r.Use(requestid.New())
	r.Use(gin.Recovery())
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization", "X-Workspace-ID"},
		ExposeHeaders:    []string{"X-Request-ID"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// 구조화 로깅 미들웨어
	r.Use(func(c *gin.Context) {
		start := time.Now()
		c.Next()
		log.Info("request",
			zap.String("method",  c.Request.Method),
			zap.String("path",    c.Request.URL.Path),
			zap.Int("status",     c.Writer.Status()),
			zap.Duration("latency", time.Since(start)),
			zap.String("request_id", requestid.Get(c)),
		)
	})

	// ── 서비스 초기화 ─────────────────────────────────────
	authSvc     := auth.NewService(cfg.Auth)
	approvalSvc := approval.NewService()

	// ── 라우트 등록 ───────────────────────────────────────
	r.GET("/health", func(c *gin.Context) {
		response.OK(c, gin.H{
			"status":  "ok",
			"version": "1.0.0",
			"time":    time.Now(),
		})
	})

	api := r.Group("/api/v1")

	// 인증 (공개)
	authHandler := auth.NewHandler(authSvc)
	authHandler.RegisterRoutes(api)

	// 인증 필요 라우트
	secured := api.Group("")
	secured.Use(mw.Auth(authSvc))
	{
		approvalHandler := approval.NewHandler(approvalSvc)
		approvalHandler.RegisterRoutes(secured)
	}

	// ── SSE 엔드포인트 ────────────────────────────────────
	api.GET("/events", mw.Auth(authSvc), func(c *gin.Context) {
		c.Header("Content-Type",  "text/event-stream")
		c.Header("Cache-Control", "no-cache")
		c.Header("Connection",    "keep-alive")

		ticker := time.NewTicker(30 * time.Second)
		defer ticker.Stop()

		done := c.Request.Context().Done()
		for {
			select {
			case <-done:
				return
			case <-ticker.C:
				c.SSEvent("ping", time.Now().Unix())
				c.Writer.Flush()
			}
		}
	})

	// ── 그레이스풀 셧다운 ─────────────────────────────────
	srv := &http.Server{
		Addr:         ":" + cfg.Server.Port,
		Handler:      r,
		ReadTimeout:  cfg.Server.Timeout,
		WriteTimeout: cfg.Server.Timeout,
	}

	go func() {
		log.Info("서버 시작", zap.String("addr", srv.Addr))
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal("서버 시작 실패", zap.Error(err))
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Info("서버 종료 중...")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	srv.Shutdown(ctx)
	log.Info("서버 종료 완료")
}
