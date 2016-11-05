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
	make build && ./server

clean:
	[ -e ./server ] && rm server || find ./public && rm -rf ./public

migrate:
	cp -rf ../front/public ./public

docker-build:
	docker build -t exec-container .

deploy:
	gcloud compute --project "jphacks-kb1608" ssh --zone "asia-northeast1-c" "jphacks-kb1608" sudo service nginx restart
	gcloud compute --project "jphacks-kb1608" ssh --zone "asia-northeast1-c" "jphacks-kb1608" killall server || true
	gcloud compute --project jphacks-kb1608 copy-files --zone asia-northeast1-c \
		./server jphacks-kb1608:~/server
	gcloud compute --project jphacks-kb1608 copy-files --zone asia-northeast1-c \
		./public jphacks-kb1608:~/public
	gcloud compute --project "jphacks-kb1608" ssh --zone "asia-northeast1-c" "jphacks-kb1608" sudo cp ./server /srv/server
	gcloud compute --project "jphacks-kb1608" ssh --zone "asia-northeast1-c" "jphacks-kb1608" nohup /srv/server &
