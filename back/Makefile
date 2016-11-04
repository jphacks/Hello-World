setup:
	which go || brew install go
	which godep || go get github.com/tools/godep
	godep restore

save:
	godep save

build:
	go build server.go

run:
	make build && ./server

clean:
	rm server

migrate:
	rm -rf ./public && cp ../front/public
