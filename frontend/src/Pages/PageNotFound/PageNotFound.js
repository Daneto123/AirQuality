import React from 'react';
import './PageNotFound.css';

const PageNotFound = () => {
  return (
    <div className='container'>
      <img src={require('./404_page.png')} alt="Page not found" className="background-image" />
      <a href="/" class="button">Go to Homepage</a>
    </div>
  );
};

export default PageNotFound;
