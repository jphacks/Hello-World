package controller

import (
	"net/http"

	"gopkg.in/gin-gonic/gin.v1"
)

// Handler is controller for this application.
type Handler struct{}

// Hello returns string "Hello name".
func (h *Handler) Hello(c *gin.Context) {
	name := c.Param("name")
	c.String(http.StatusOK, "Hello %s", name)
}

// Pong returns string "pong".
func (h *Handler) Pong(c *gin.Context) {
	c.String(http.StatusOK, "pong")
}
