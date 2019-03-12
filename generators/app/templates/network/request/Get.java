import java.util.Collection;
import java.util.logging.Level;
import java.util.logging.Logger;

import org.hyperledger.fabric.sdk.ProposalResponse;

/*
 * Request to get the state of a diploma by hash
 */
public class Get extends A_BlockchainRequest {

	private String hash = null;
	/* Diploma state */
	public String state = null;

	public Get(String hash) {

		/* Enroll Admin to Org1MSP and initialize channel */
		super();
		this.hash = hash;
	}

	/*
	 * Query the state of the diploma related to the hash
	 */
	public void send() throws EntityNotFound, Exception {

		String[] args1 = { hash };
		Logger.getLogger(Get.class.getName()).log(Level.INFO,
				"Querying for the state of the diploma related to the hash: " + args1[0]);

		Collection<ProposalResponse> responses1Query = channelClient.queryByChainCode(Config.CHAINCODE_1_NAME, "get",
				args1);
		for (ProposalResponse pres : responses1Query) {
			String stringResponse = new String(pres.getChaincodeActionResponsePayload());
			transactionID = pres.getTransactionID();
			state = stringResponse;

			// Raising exception if the diploma hash is not found
			if (state.equals("NOT_FOUND")) {
				throw new EntityNotFound("");
			}

			Logger.getLogger(Get.class.getName()).log(Level.INFO,
					"\n\n\n#----------------------------> Query response for the hash: " + hash + ": " + stringResponse
							+ "\n\n\n");
		}

	}
}
