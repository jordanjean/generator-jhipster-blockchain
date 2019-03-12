package main

import (
	"fmt"

	"github.com/hyperledger/fabric/core/chaincode/shim"
	pb "github.com/hyperledger/fabric/protos/peer"
)

type SimpleChaincode struct {
}

/*
 * The Init method is called when the Smart Contract is instantiated by the blockchain network
 * Best practice is to have any Ledger initialization in separate function -- see initLedger()
 */
func (t *SimpleChaincode) Init(stub shim.ChaincodeStubInterface) pb.Response {
	fmt.Println("chaincode - Init")
	return shim.Success(nil)
}

func (t *SimpleChaincode) Invoke(stub shim.ChaincodeStubInterface) pb.Response {
	fmt.Println("chaincode - Invoke")
	function, args := stub.GetFunctionAndParameters()
	if function == "delete" {
		return t.delete(stub, args)
	} else if function == "set" {
		return t.set(stub, args)
	} else if function == "add" {
		return t.add(stub, args)
	} else if function == "get" {
		return t.get(stub, args)
	}

	return shim.Error("Invalid invoke function name. Expecting \"delete\" \"set\" \"add\" \"get\"")
}

// Deletes an entity from state
func (t *SimpleChaincode) delete(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	var err error

	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting 1")
	}

	entity := args[0]
	fmt.Println("chaincode - delete(entity: " + entity + ")")

	// Checking that the entity exists
	stateBytes, err := stub.GetState(entity)
	if err != nil {
		fmt.Println("Error while getting state from the ledger: " + err.Error())
		return shim.Error(err.Error())
	}
	if stateBytes == nil {
		return shim.Success([]byte("NOT_FOUND"))
	}

	// Delete the key from the state in ledger
	err = stub.DelState(entity)
	if err != nil {
		return shim.Error("Failed to delete state")
	}

	return shim.Success(nil)
}

// Get callback representing the query of a chaincode
func (t *SimpleChaincode) get(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	var entity string // Entity to query

	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting entity to query")
	}

	entity = args[0]
	fmt.Println("chaincode - get(entity: " + entity + ")")

	// Get the state from the ledger
	stateBytes, err := stub.GetState(entity)
	if err != nil {
		fmt.Println("Error while getting state from the ledger: " + err.Error())
		return shim.Error(err.Error())
	}
	if stateBytes == nil {
		fmt.Println("NOT_FOUND")
		return shim.Success([]byte("NOT_FOUND"))
	}

	fmt.Printf("Query Response for %s: %s\n", entity, string(stateBytes))
	return shim.Success(stateBytes)
}

// Add the entity to the blockchain
func (t *SimpleChaincode) add(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	var entity string 		// Entity to store in the ledger
	var value string 	// Value to store in the ledger
	var err error

	if len(args) != 2 {
		return shim.Error("Incorrect number of arguments. Expecting entity and value to add.")
	}

	entity = args[0]
	value = args[1]
	fmt.Println("chaincode - add(entity: " + entity + " value: " + value + ")")

	// Checking that the entity has not been added yet
	stateBytes, err := stub.GetState(entity)
	if err != nil {
		fmt.Println("Error while getting state from the ledger: " + err.Error())
		return shim.Error(err.Error())
	}
	if stateBytes != nil {
		return shim.Success([]byte("ALREADY_EXIST"))
	}

	// Write the state to the ledger
	err = stub.PutState(entity, []byte(value))
	if err != nil {
		return shim.Error(err.Error())
	}

	return shim.Success(nil)
}

// Set an existing entity value
func (t *SimpleChaincode) set(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	var entity string 		// Entity to set
	var value string 	// Value to write
	var err error

	if len(args) != 2 {
		return shim.Error("Incorrect number of arguments. Expecting entity and value to write.")
	}

	entity = args[0]
	value = args[1]
	fmt.Println("chaincode - set(entity: " + entity + " value: " + value + ")")

	// Checking that the entity exists
	stateBytes, err := stub.GetState(entity)
	if err != nil {
		fmt.Println("Error while getting state from the ledger: " + err.Error())
		return shim.Error(err.Error())
	}
	if stateBytes == nil {
		return shim.Success([]byte("NOT_FOUND"))
	}

	// Checking that the state is not already set
	if string(stateBytes) == value {
		return shim.Success([]byte("STATE_ALREADY_SET"))
	}

	// Write the state to the ledger
	err = stub.PutState(entity, []byte(value))
	if err != nil {
		return shim.Error(err.Error())
	}

	return shim.Success(nil)
}

func main() {
	err := shim.Start(new(SimpleChaincode))
	if err != nil {
		fmt.Printf("Error starting UGAChaincode: %s", err)
	}
}
