public class EntityNotFound extends A_BlockchainException {

	public EntityNotFound(String s) {
		super(s);
	}

	/**
	 *
	 */
	private static final long serialVersionUID = 1L;

	@Override
	public String toString() {
		return "EntityNotFound";
	}
}
