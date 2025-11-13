import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="py-5" style={{ backgroundColor: '#ffffff', borderTop: '1px solid #e9ecef' }}>
      <div className="container text-center">
        <div className="row">
          <div className="col-12">
            <p className="text-muted mb-0">
              Made with <i className="material-icons text-danger text-sm">favorite</i> by
              <a
                href="https://goncalomiranda.dev"
                className="text-primary text-decoration-none font-weight-bold ms-1"
                target="_blank"
                rel="noopener noreferrer"
              >
                goncalomiranda.dev
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
