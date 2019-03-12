public abstract class A_BlockchainException extends Exception {

	/**
	 *
	 */
	private static final long serialVersionUID = 1L;
	private String status;

	public abstract String toString();

	public A_BlockchainException(String s) {
		this.status = s;
	}

	public String getStatus() {
		return status;
	}

	public void setStatus(String status) {
		this.status = status;
	}
}
