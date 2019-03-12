./byfn.sh down
docker rm dev-peer0.org1.example.com-simple-chaincode-1.0
docker rmi dev-peer0.org1.example.com-simple-chaincode-1.0-f499467572dfafa417bef0b2c1aef40671d147687159f94dde67082dcaef0cb5:latest
./byfn.sh restart
