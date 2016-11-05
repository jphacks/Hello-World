package controller

import (
	"fmt"
	"net/http"

	"gopkg.in/gin-gonic/gin.v1"
)

// Executor is controller for executing user code.
type Executor struct {
	Language string `json:"language"`
	Code     string `json:"code"`
}

type Result struct {
	RunTime string
	Output  string
}

func (e *Executor) Handle(c *gin.Context) {
	var exec Executor
	c.BindJSON(&exec)
	fmt.Println(exec.Language)
	var result Result
	switch exec.Language {
	case "ruby":
		result.RunTime = "0,04ms"
		result.Output = "Hello world"
	case "js":
		result.RunTime = "0,04ms"
		result.Output = "Hello world"
	default:
		result.Output = "Error"
		result.RunTime = "-ms"
	}

	c.String(http.StatusOK, "%s", "ok")
	c.JSON(http.StatusOK, gin.H{
		"run_time": result.RunTime,
		"output":   result.Output,
	})
}
