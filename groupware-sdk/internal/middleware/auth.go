package middleware

import (
	"strings"
	"github.com/gin-gonic/gin"
	"github.com/groupware/sdk/internal/auth"
	"github.com/groupware/sdk/pkg/response"
)

// Auth JWT 인증 미들웨어
func Auth(svc *auth.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		if header == "" || !strings.HasPrefix(header, "Bearer ") {
			response.Unauthorized(c, "인증 토큰이 필요합니다")
			c.Abort()
			return
		}

		token := strings.TrimPrefix(header, "Bearer ")
		identity, err := svc.Verify(token)
		if err != nil {
			response.Unauthorized(c, err.Error())
			c.Abort()
			return
		}

		// 컨텍스트에 사용자 정보 저장
		c.Set("user_id",      identity.UserID)
		c.Set("email",        identity.Email)
		c.Set("display_name", identity.DisplayName)
		c.Set("roles",        identity.Roles)
		c.Next()
	}
}

// WorkspaceID URL 파라미터에서 workspace_id 추출
func WorkspaceID() gin.HandlerFunc {
	return func(c *gin.Context) {
		wsID := c.Param("workspace_id")
		if wsID == "" {
			wsID = c.Query("workspace_id")
		}
		if wsID == "" {
			wsID = c.GetHeader("X-Workspace-ID")
		}
		c.Set("workspace_id", wsID)
		c.Next()
	}
}

// CurrentUserID 컨텍스트에서 사용자 ID 추출 헬퍼
func CurrentUserID(c *gin.Context) string {
	id, _ := c.Get("user_id")
	s, _ := id.(string)
	return s
}

// CurrentWorkspaceID 컨텍스트에서 workspace_id 추출 헬퍼
func CurrentWorkspaceID(c *gin.Context) string {
	id, _ := c.Get("workspace_id")
	s, _ := id.(string)
	return s
}
