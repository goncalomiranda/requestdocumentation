function LogoSection() {
  return (
    <header className="container mb-0">
      <div className="row justify-content-center align-items-center my-2">
        <div className="col-auto">
          <img 
            src="/lvf_blackfont_logo.png" 
            className="img-fluid" 
            alt="Company logo" 
            style={{ maxHeight: '320px' }} 
          />
        </div>
      </div>
    </header>
  );
}

export default LogoSection;