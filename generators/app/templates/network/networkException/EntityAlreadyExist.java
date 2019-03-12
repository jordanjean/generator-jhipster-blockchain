public class EntityAlreadyExist extends A_BlockchainException {

	public EntityAlreadyExist(String s) {
		super(s);
	}

	/**
	 *
	 */
	private static final long serialVersionUID = 1L;

	@Override
	public String toString() {
		return "EntityAlreadyPresent";
	}
}
