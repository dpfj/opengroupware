package approval

import (
	"errors"
	"github.com/gin-gonic/gin"
	mw "github.com/groupware/sdk/internal/middleware"
	"github.com/groupware/sdk/internal/model"
	"github.com/groupware/sdk/pkg/response"
)

type Handler struct{ svc *Service }

func NewHandler(svc *Service) *Handler { return &Handler{svc: svc} }

func (h *Handler) RegisterRoutes(rg *gin.RouterGroup) {
	g := rg.Group("/approval")
	g.POST("/docs",              h.Create)
	g.GET("/docs",               h.List)
	g.GET("/docs/pending",       h.ListPending)
	g.GET("/docs/:id",           h.Get)
	g.GET("/docs/:id/history",   h.GetHistory)
	g.POST("/docs/:id/submit",   h.Submit)
	g.POST("/docs/:id/approve",  h.Approve)
	g.POST("/docs/:id/reject",   h.Reject)
	g.POST("/docs/:id/withdraw", h.Withdraw)
}

func (h *Handler) Create(c *gin.Context) {
	var req struct {
		Title       string                 `json:"title"        binding:"required"`
		TemplateID  string                 `json:"template_id"  binding:"required"`
		Content     map[string]interface{} `json:"content"`
		Steps       []map[string]string    `json:"steps"        binding:"required,min=1"`
		AttachKeys  []string               `json:"attach_keys"`
		WorkspaceID string                 `json:"workspace_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "VALIDATION_ERROR", err.Error())
		return
	}
	doc, err := h.svc.Create(mw.CurrentUserID(c), req.WorkspaceID, req.Title,
		req.TemplateID, req.Content, req.Steps, req.AttachKeys)
	if err != nil {
		response.BadRequest(c, "CREATE_FAILED", err.Error())
		return
	}
	response.Created(c, gin.H{"data": doc})
}

func (h *Handler) List(c *gin.Context) {
	docs := h.svc.ListByAuthor(mw.CurrentUserID(c), c.Query("workspace_id"))
	response.OK(c, gin.H{"data": docs})
}

func (h *Handler) ListPending(c *gin.Context) {
	docs := h.svc.ListPending(mw.CurrentUserID(c), c.Query("workspace_id"))
	response.OK(c, gin.H{"data": docs})
}

func (h *Handler) Get(c *gin.Context) {
	doc, err := h.svc.Get(c.Param("id"))
	if err != nil {
		response.NotFound(c, err.Error())
		return
	}
	response.OK(c, gin.H{"data": doc})
}

func (h *Handler) GetHistory(c *gin.Context) {
	events, err := h.svc.History(c.Param("id"))
	if err != nil {
		response.NotFound(c, err.Error())
		return
	}
	response.OK(c, gin.H{"data": events})
}

func (h *Handler) Submit(c *gin.Context) {
	doc, err := h.svc.Submit(c.Param("id"), mw.CurrentUserID(c))
	h.result(c, doc, err)
}

func (h *Handler) Approve(c *gin.Context) {
	var req struct{ Comment string `json:"comment"` }
	c.ShouldBindJSON(&req)
	doc, err := h.svc.Approve(c.Param("id"), mw.CurrentUserID(c), req.Comment)
	h.result(c, doc, err)
}

func (h *Handler) Reject(c *gin.Context) {
	var req struct{ Reason string `json:"reason" binding:"required"` }
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "VALIDATION_ERROR", "반려 사유는 필수입니다")
		return
	}
	doc, err := h.svc.Reject(c.Param("id"), mw.CurrentUserID(c), req.Reason)
	h.result(c, doc, err)
}

func (h *Handler) Withdraw(c *gin.Context) {
	doc, err := h.svc.Withdraw(c.Param("id"), mw.CurrentUserID(c))
	h.result(c, doc, err)
}

func (h *Handler) result(c *gin.Context, doc *model.ApprovalDoc, err error) {
	if err == nil {
		response.OK(c, gin.H{"data": doc})
		return
	}
	switch {
	case errors.Is(err, ErrNotFound):
		response.NotFound(c, err.Error())
	case errors.Is(err, ErrUnauthorized), errors.Is(err, ErrNotMyTurn):
		response.Forbidden(c, err.Error())
	default:
		response.BadRequest(c, "INVALID_OPERATION", err.Error())
	}
}
