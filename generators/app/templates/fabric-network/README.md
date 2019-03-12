# Fabric Network

An Hyperledger Fabric network v1.4

## Prerequisites

To run this software, you must have the Hyperledger Fabric prerequisites specified [here](https://hyperledger-fabric.readthedocs.io/en/release-1.4/prereqs.html).

## How to run

To start the network go to `fabric-network/network/`, run `./byfn.sh generate` and run `./byfn.sh up`. Upon successful completion you should see:

```
===================== All GOOD, BYFN execution completed =====================


 _____   _   _   ____
| ____| | \ | | |  _ \
|  _|   |  \| | | | | |
| |___  | |\  | | |_| |
|_____| |_| \_| |____/
```

## Troubleshooting

### 1.  Always start your network fresh

If you get this kind of error:

```
Error: got unexpected status: BAD_REQUEST -- error authorizing update: error validating ReadSet: readset expected key [Group]  /Channel/Application/Org1MSP at version 0, but got version 1
    	!!!!!!!!!!!!!!! Channel creation failed !!!!!!!!!!!!!!!!
========= ERROR !!! FAILED to execute End-2-End Scenario ===========

ERROR !!!! Test failed
```

Remove artifacts, crypto, containers and chaincode images using the command `./byfn.sh down` and try to start the network again.
