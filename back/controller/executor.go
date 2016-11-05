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
	var request Executor
	c.BindJSON(&request)
	fmt.Println(request.Language)
	var response Result

	c.String(http.StatusOK, "%s", "ok")
	c.JSON(http.StatusOK, gin.H{
		"run_time": response.RunTime,
		"output":   response.Output,
	})
}

func (e *Executor) Exec(request Executor) (Result, error) {
	var exec_result Result
	switch request.Language {
	case "ruby":
		exec_result.RunTime = "0,04ms"
		exec_result.Output = "Hello world"
	case "js":
		exec_result.RunTime = "0,04ms"
		exec_result.Output = "Hello world"
	default:
		exec_result.Output = "Error"
		exec_result.RunTime = "-ms"
	}
	return exec_result, nil
}
