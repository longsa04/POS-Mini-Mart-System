import miniMartLogo from "../../../assets/mini-mart-mark.svg";

const ReceiptBranding = () => {
  return (
    <div className="page">
      <h2 className="mb-3">Receipt Branding</h2>
      <p className="text-secondary font-12 mb-4">
        Demonstrates how the POS receipt uses store identity assets. Hook this
        into the storage location of your brand assets when ready.
      </p>

      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <h6>Logo preview</h6>
          <p className="text-secondary font-12">
            Replace <code>mini-mart-mark.svg</code> with your own logo for live
            deployments.
          </p>
          <div className="border rounded p-3 d-inline-flex bg-light">
            <img
              src={miniMartLogo}
              alt="MiniMart Hub logo"
              style={{ width: "140px" }}
            />
          </div>
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="card-body">
          <h6>Receipt footer message</h6>
          <p className="text-secondary font-12 mb-1">
            Keep your thank-you message and contact info here. Update the
            <code>PrintInvoice.jsx</code> component to pull values from an API.
          </p>
          <ul className="mb-0 text-secondary font-12">
            <li>Thank you for shopping with us!</li>
            <li>Keep this receipt for your records.</li>
            <li>Contact email and hotline</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ReceiptBranding;

