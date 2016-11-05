setup:
	which docker || brew cask install docker
	which go || brew install go
	which godep || go get github.com/tools/godep
	godep restore

save:
	godep save

build:
	go build server.go

run:
	docker run -i -t exec-container uname -a || docker build -t exec-container .
	make build && ./server

clean:
	[ -e ./server ] && rm server || find ./public && rm -rf ./public

migrate:
	cp -rf ../front/public ./public
