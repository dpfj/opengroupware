package response

import (
	"net/http"
	"github.com/gin-gonic/gin"
)

type Response struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   *APIError   `json:"error,omitempty"`
}

type APIError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

func OK(c *gin.Context, data interface{}) {
	c.JSON(http.StatusOK, Response{Success: true, Data: data})
}

func Created(c *gin.Context, data interface{}) {
	c.JSON(http.StatusCreated, Response{Success: true, Data: data})
}

func BadRequest(c *gin.Context, code, msg string) {
	c.JSON(http.StatusBadRequest, Response{
		Success: false,
		Error:   &APIError{Code: code, Message: msg},
	})
}

func Unauthorized(c *gin.Context, msg string) {
	c.JSON(http.StatusUnauthorized, Response{
		Success: false,
		Error:   &APIError{Code: "UNAUTHORIZED", Message: msg},
	})
}

func Forbidden(c *gin.Context, msg string) {
	c.JSON(http.StatusForbidden, Response{
		Success: false,
		Error:   &APIError{Code: "FORBIDDEN", Message: msg},
	})
}

func NotFound(c *gin.Context, msg string) {
	c.JSON(http.StatusNotFound, Response{
		Success: false,
		Error:   &APIError{Code: "NOT_FOUND", Message: msg},
	})
}

func Conflict(c *gin.Context, msg string) {
	c.JSON(http.StatusConflict, Response{
		Success: false,
		Error:   &APIError{Code: "CONFLICT", Message: msg},
	})
}

func InternalError(c *gin.Context, msg string) {
	c.JSON(http.StatusInternalServerError, Response{
		Success: false,
		Error:   &APIError{Code: "INTERNAL_ERROR", Message: msg},
	})
}
