import org.hyperledger.fabric.sdk.Channel;
import org.hyperledger.fabric.sdk.EventHub;
import org.hyperledger.fabric.sdk.Orderer;
import org.hyperledger.fabric.sdk.Peer;

public abstract class A_BlockchainRequest {

	protected FabricClient fabClient;
	protected ChannelClient channelClient;
	public String transactionID;

	public String result;

	public A_BlockchainRequest() {
		init();
	}

	/*
	 * Enroll Admin to Org1 and initialize the channel
	 */
	protected void init() {
		try {

			Util.cleanUp();
			String caUrl = Config.CA_ORG1_URL;
			CAClient caClient = new CAClient(caUrl, null);

			/* Enroll Admin to Org1MSP */
			UserContext adminUserContext = new UserContext();
			adminUserContext.setName(Config.ADMIN);
			adminUserContext.setAffiliation(Config.ORG1);
			adminUserContext.setMspId(Config.ORG1_MSP);
			caClient.setAdminUserContext(adminUserContext);
			adminUserContext = caClient.enrollAdminUser(Config.ADMIN, Config.ADMIN_PASSWORD);

			fabClient = new FabricClient(adminUserContext);

			/* Create and initialize the channel */
			channelClient = fabClient.createChannelClient(Config.CHANNEL_NAME);
			Channel channel = channelClient.getChannel();

			Peer peer = fabClient.getInstance().newPeer(Config.ORG1_PEER_0, Config.ORG1_PEER_0_URL);
			EventHub eventHub = fabClient.getInstance().newEventHub("eventhub01", "grpc://localhost:7053");
			Orderer orderer = fabClient.getInstance().newOrderer(Config.ORDERER_NAME, Config.ORDERER_URL);
			channel.addPeer(peer);
			channel.addEventHub(eventHub);
			channel.addOrderer(orderer);
			channel.initialize();

		} catch (Exception e) {
			e.printStackTrace();
		}
	}

	/* Send the request to the blockchain */
	public abstract void send() throws Exception;

}
