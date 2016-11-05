package main

import (
	"os"
	"path/filepath"

	"github.com/Tamrin007/contrib/static"
	"github.com/jphacks/KB_1608/back/controller"
	"gopkg.in/gin-gonic/gin.v1"
)

func main() {
	r := gin.Default()
	c := &controller.Handler{}
	e := &controller.Executor{}

	// Hosting public directory on server root
	dir, err := filepath.Abs(filepath.Dir(os.Args[0]))
	if err != nil {
		return
	}
	r.Use(static.Serve("/", static.LocalFile(dir+"/public", true)))

	// Routing
	r.GET("/ping", c.Pong)
	r.POST("/exec", e.Handle)

	// Listening
	r.Run(":8080")
}
