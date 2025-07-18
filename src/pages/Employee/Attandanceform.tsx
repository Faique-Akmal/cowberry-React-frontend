import axios from 'axios';
import React from 'react'

function Attandancestartform() {
         const [image, setImage] = React.useState(null);
        const handleImageChange = (e) => {
            setImage(e.target.files[0]);
        }

    const handleApi =  (e) => {
     
        const formData = new FormData();
        formData.append('image', image);
        axios.post('http://192.168.0.144:8000/api/attandance-start/', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
        
    }
  return (
    <div>
      <input type="file" name='file' onChange={ handleImageChange}/>
        <button type="submit" className='bg-blue-500 text-white px-4 py-2 rounded'onClick={handleApi}>Submit</button>
    </div>
  )
}

export default Attandancestartform
