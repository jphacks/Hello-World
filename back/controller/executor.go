package controller

import (
	"bufio"
	"fmt"
	"net/http"
	"os"
	"os/exec"

	"github.com/mattn/go-shellwords"
	"gopkg.in/gin-gonic/gin.v1"
)

// Executor is controller for executing user code.
type Executor struct {
	Language string `json:"language"`
	Code     string `json:"code"`
}

// Result has response data.
type Result struct {
	RunTime string
	Output  string
}

// Handle controller for Executing user code
func (e *Executor) Handle(c *gin.Context) {
	var request Executor
	c.BindJSON(&request)
	fmt.Println(request.Language)
	var response Result
	response, err := request.Exec(request)
	if err != nil {
		fmt.Println("ERROR!!!: ", err)
	}

	c.String(http.StatusOK, "%s", "ok")
	c.JSON(http.StatusOK, gin.H{
		"run_time": response.RunTime,
		"output":   response.Output,
	})
}

// Exec execute user code
func (e *Executor) Exec(request Executor) (Result, error) {
	var execResult Result
	var (
		filename string
		execCmd  string
	)
	switch request.Language {
	case "ruby":
		filename = "Main.rb"
		execCmd = "ruby " + filename
	case "js":
		filename = "script.js"
		execCmd = "node " + filename
	case "python2":
		filename = "Main.py"
		execCmd = "python " + filename
	default:
		execResult.Output = "Invalid language"
		execResult.RunTime = "-ms"
		return execResult, nil
	}

	// コンテナを作成
	output, err := createDocker(execCmd)
	if err != nil {
		return execResult, nil
	}

	// get container id from output
	containerID := output[0:12]
	fmt.Println("container ID: ", containerID)

	// コンテナにユーザコードをコピー
	err = copyToContainer(request.Code, filename, containerID)
	if err != nil {
		removeContainer(containerID)
		return execResult, fmt.Errorf("copy to container: %v", err)
	}

	// ユーザコードの実行
	execResult.Output, execResult.RunTime, err = startContainer(containerID)
	if err != nil {
		removeContainer(containerID)
		return execResult, fmt.Errorf("exec user code: %v", err)
	}

	// コンテナを削除
	err = removeContainer(containerID)
	if err != nil {
		return execResult, fmt.Errorf("remove container: %v", err)
	}

	return execResult, nil
}

func createDocker(execCmd string) (string, error) {
	// create docker image
	dockerCmd :=
		`docker create -i ` +
			`--net none ` +
			`--cpuset-cpus 0 ` +
			`--memory 512m --memory-swap 512m ` +
			`--ulimit nproc=10:10 ` +
			`--ulimit fsize=1000000 ` +
			`-w /workspace ` +
			`exec-container ` +
			`/usr/bin/time -p -f "%e" -o /time.txt ` +
			`timeout 3 ` +
			`su nobody -s /bin/bash -c "` +
			execCmd +
			`"`

	fmt.Println("exec: ", dockerCmd)

	// コマンドと引数にパース
	cmd, err := shellwords.Parse(dockerCmd)
	if err != nil {
		return "", fmt.Errorf("parse dockerCmd: %v", err)
	}
	output, err := exec.Command(cmd[0], cmd[1:]...).Output()
	if err != nil {
		return "", fmt.Errorf("create docker: %v", err)
	}

	return string(output), err
}

func copyToContainer(code string, filename string, containerID string) error {
	exec.Command("rm", "-rf", "/tmp/workspace").Run()
	err := exec.Command("mkdir", "/tmp/workspace").Run()
	if err != nil {
		return fmt.Errorf("make directory: %v", err)
	}
	err = exec.Command("chmod", "777", "/tmp/workspace").Run()
	if err != nil {
		return fmt.Errorf("chmod: %v", err)
	}

	fp, err := os.Create("/tmp/workspace/" + filename)
	if err != nil {
		return fmt.Errorf("save usr code: %v", err)
	}
	defer fp.Close()
	fp.Write([]byte(code))

	dockerCmd := `docker cp /tmp/workspace ` + containerID + ":/"
	fmt.Println("exec: ", dockerCmd)
	cmd, err := shellwords.Parse(dockerCmd)
	if err != nil {
		return fmt.Errorf("parse dockerCmd: %v", err)
	}
	err = exec.Command(cmd[0], cmd[1:]...).Run()
	if err != nil {
		return fmt.Errorf("cp to docker: %v", err)
	}
	return nil
}

func startContainer(containerID string) (string, string, error) {
	dockerCmd := `docker start -i ` + containerID
	fmt.Println("exec: ", dockerCmd)
	cmd, err := shellwords.Parse(dockerCmd)
	if err != nil {
		return "", "", fmt.Errorf("parse dockerCmd: %v", err)
	}
	output, err := exec.Command(cmd[0], cmd[1:]...).CombinedOutput()
	if err != nil {
		return string(output), "---", fmt.Errorf("start container: %v", err)
	}
	_, err = os.Stat("/tmp/time.txt")
	if err != nil {
		_, err = os.Create("/tmp/time.txt")
		if err != nil {
			return "", "", fmt.Errorf("create /tmp/time.txt: %v", err)
		}
	}
	dockerCmd = `docker cp ` + containerID + `:/time.txt /tmp/time.txt`
	fmt.Println("exec: ", dockerCmd)
	cmd, err = shellwords.Parse(dockerCmd)
	if err != nil {
		return "", "", fmt.Errorf("parse dockerCmd: %v", err)
	}
	err = exec.Command(cmd[0], cmd[1:]...).Run()
	if err != nil {
		return "", "", fmt.Errorf("cp to host: %v", err)
	}
	fp, err := os.Open("/tmp/time.txt")
	defer fp.Close()
	scanner := bufio.NewScanner(fp)
	var time string
	if scanner.Scan() {
		time = scanner.Text() + "s"
	}
	if err := scanner.Err(); err != nil {
		return "", "", fmt.Errorf("scan time: %v", err)
	}
	return string(output), time, nil
}

func removeContainer(containerID string) error {
	dockerCmd := `docker rm ` + containerID
	fmt.Println("exec: ", dockerCmd)
	cmd, err := shellwords.Parse(dockerCmd)
	if err != nil {
		return fmt.Errorf("parse dockerCmd: %v", err)
	}
	err = exec.Command(cmd[0], cmd[1:]...).Run()
	if err != nil {
		return fmt.Errorf("remove container: %v", err)
	}

	return nil
}
