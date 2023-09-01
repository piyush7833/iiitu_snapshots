import React from 'react'
import styled from 'styled-components'
import { useSelector } from 'react-redux';
import { useState } from 'react';
import AlertModal from '../components/modal/AlertModal';
import { useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { updateUserStart, updateUserSuccess, updateUserFailure, deleteUserFailure, deleteUserStart, deleteUserSuccess } from '../redux/userSlice'
import { useDispatch } from 'react-redux';
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import app from "../firebase"; //importing app
const Container = styled.div`
display:flex;
align-items:center;
justify-content:center;
height:95vh;
@media (max-width: 500px) {
  flex-direction:column;
}
`;
const Image = styled.img`
height:40vh;
width:40vh;
border-radius: 50%;
margin-bottom:2vh;
`;
const Details = styled.div`
display:flex;
align-items:strech;
flex-direction:column;
justify-content:flex-start;
width:50%;
@media (max-width: 500px) {
  width:100%;
  justify-content:space-between;
}
`;
const Photo = styled.div`
display:flex;
align-items:center;
// justify-content:center;
flex-direction:column;
width:50%;
@media (max-width: 500px) {
  width:100%;
}
`;
const Input = styled.input`
  border: 1px solid ${({ theme }) => theme.soft};
  border-radius: 3px;
  padding: 10px;
  width: 50%;
  background-color: transparent;
  border-radius:1.3rem;
  color: ${({ theme }) => theme.text};
`;
const Infos = styled.div`
  background-color: transparent;
  width: 100%;
  color: ${({ theme }) => theme.text};
  display:flex; 
  margin-top:2vh;
  align-items: center;
  justify-content: center;
`;
const Info = styled.div`
  background-color: transparent;
  width: 40%;
  border-radius:1.3rem;
  color: ${({ theme }) => theme.text};
`;
const Info2 = styled.div`
  background-color: transparent;
  width: 50%;
  border-radius:1.3rem;
  color: ${({ theme }) => theme.text};
`;
const Button = styled.button`
  border-radius: 1.3rem;
padding:0.8rem 1rem;
  font-weight: 500;
  cursor: pointer;
  background-color: transparent;;
  color: ${({ theme }) => theme.text};
  box-shadow: 15px 15px 20px rgba(0,0,0,.6);
  text-align:center;
  margin-top:2vh;
  @media (max-width: 350px) {
    padding:0.6rem 0.4rem;
  }
`;
const Btn = styled.div`
display:flex;
align-items:center;
justify-content:space-evenly; 
margin-top:3vh;

`;
const Profile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const handleOpenAlertModal = (message) => {
    setAlertMessage(message);
    setShowAlertModal(true);
  };

  const handleCloseAlertModal = () => {
    setShowAlertModal(false);
    setAlertMessage('');
  };

  const { currentUser } = useSelector((state) => state.user);
  // export currentUser;
  const [img, setImg] = useState("");
  const [inputs, setInputs] = useState({});
  const [imgPerc, setImgPerc] = useState(0);  //upload percentage
  const [edit, setEdit] = useState(false);
  const [imgName, setImgName] = useState(currentUser.imgName);

  const handleImgDelete = async () => {
    if (currentUser.imgName !== "") {
      const storage = getStorage(app);
      const desertRef = ref(storage, `profile/${currentUser.imgName}`);
      deleteObject(desertRef).then(() => {
      }).catch((error) => {
        handleOpenAlertModal(error.message, "red");
        setLoading(false)
      });
    }
  }

  const handleChange = (e) => {
    setInputs((prev) => {
      return { ...prev, [e.target.name]: e.target.value };  //changing title and description  //take previtems and update it with new
    });
  };


  const uploadFile =async (file, urlType) => {
    const storage = getStorage(app);  //getting storage
    const fileName = new Date().getTime() + file.name;  //we can also add it with folder which i will do with photos
    const storageRef = ref(storage, 'profile/' + fileName);   //giving storage reference
    const uploadTask = uploadBytesResumable(storageRef, file);
    setImgName(fileName);
    uploadTask.on( //upload start
      "state_changed",
      (snapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setImgPerc(Math.round(progress)) //firebase gives us upload percentage which we are using to set image and video percentage
        switch (snapshot.state) {
          case "paused":
            handleOpenAlertModal("Upload paused", "yellow")
            break;
          case "running":
            // handleOpenAlertModal("Uploading","green")
            break;
          default:
            break;
        }
      },
      (error) => { handleOpenAlertModal(error.message, 'red') }, //leaving error
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          setInputs((prev) => {
            handleImgDelete();
            setImg("")
            return { ...prev, [urlType]: downloadURL };  //changing imgUrl and videourl in mongodb
          });
        });
      }
    );
  };

  useEffect(() => {
    img && uploadFile(img, "img");
  }, [img]);

  const handleUpdate = async (e) => { //sending data to db
    e.preventDefault()
    dispatch(updateUserStart);
    try {
      //img && await uploadFile(img, "img");
      const res = await axios.put(`/users/${currentUser._id}`, { ...inputs, imgName })  //sending all inputs and tags
      handleCloseAlertModal("Profile uploaded successfully", "green");
      setEdit(false);
      dispatch(updateUserSuccess(res.data));
      setImgPerc(0)
      res.status === 200 && navigate('/profile')
    } catch (error) {
      handleOpenAlertModal(error.message, "red");
      dispatch(updateUserFailure);
    }

  }

  const [photos, setPhotos] = useState([]);
  const [videos, setVideos] = useState([]);
  const fetchPhotos = async () => {
    setLoading(true);
    const res = await axios.get(`/photos/myfiles`)
    setPhotos(res.data)
    setLoading(false);
  }
  const fetchVideos = async () => {
    setLoading(true);
    const res = await axios.get(`/videos/myfiles`);
    setVideos(res.data);
    setLoading(false);
  };


  const handleVideoDel = async (e) => {
    await axios.delete(`/videos/${e}`);
  }
  const handlePhotoDel = async (e) => {
     await axios.delete(`/photos/${e}`);
  }

  const handleDelete = async () => {

    try {
      dispatch(deleteUserStart)
      fetchPhotos()
      fetchVideos();
      photos.forEach(element => {
        const storage = getStorage(app);
        const desertRef = ref(storage, `photo/${element.fileName}`);
        deleteObject(desertRef).then(() => {

        }).catch((error) => {
          handleOpenAlertModal(error.message, "red");
          setLoading(false)
        });
        handlePhotoDel(element._id);
      });


      videos.forEach(element => {

        const storage = getStorage(app);
        const desertRef = ref(storage, `video/${element.videofileName}`);
        const desertRef2 = ref(storage, `video/${element.photofileName}`);

        deleteObject(desertRef).then(() => {

        }).catch((error) => {
          handleOpenAlertModal(error.message, 'red')
        });


        deleteObject(desertRef2).then(() => {
        }).catch((error) => {
          handleOpenAlertModal(error.message, "red");
        });
        handleVideoDel(element._id)
      });

      const res = await axios.delete(`users/${currentUser._id}`);  //todo delete users all videos
      handleOpenAlertModal("Your account is deleted", 'red')
      dispatch(deleteUserSuccess(res.data))
      navigate('/')
    } catch (error) {
      handleOpenAlertModal(error.message);
      dispatch(deleteUserFailure);
    }


  }

  function onCall() {
    setEdit(true);
  }
  function onCall2() {
    setEdit(false);
  }

  const handleUpdatePassword = async (name) => {
    try {
      await axios.post('/users/recovery', { name })
      handleOpenAlertModal("Email Sent for changing password", '#66bb6a')
    } catch (error) {
      handleOpenAlertModal(error.message, "red")
    }
  }

  return (
    <Container>
      <AlertModal
        isOpen={showAlertModal}
        onClose={handleCloseAlertModal}
        message={alertMessage}
      />
      <Photo>
        <Image src={currentUser.img} />
        {imgPerc > 0 ? (
          "Uploading:" + imgPerc + "%"
        ) : (
          <>
            {edit === true ? <Input
              type="file"
              accept="image/*"
              onChange={(e) => setImg(e.target.files[0])}
            /> : ""}
          </>
        )}
        {/* <Button>Upload Photo</Button> */}
      </Photo>
      <Details>
        <Infos><Info>Full Name : </Info>{edit === true ? <Input name='Normalname' placeholder={currentUser.Normalname} onChange={handleChange} /> : <Info2>{currentUser.Normalname}</Info2>}</Infos>
        <Infos><Info>User Name :  </Info>{edit === true ? <Input name='name' placeholder={currentUser.name} onChange={handleChange} /> : <Info2>{currentUser.name}</Info2>}</Infos>
        <Infos><Info>Phone : </Info>{edit === true ? <Input name='phone' placeholder={currentUser.phone ? currentUser.phone : "Phone number"} onChange={handleChange} /> : <Info2>{currentUser.phone}</Info2>}</Infos>
        <Infos><Info>Email : </Info><Info2>{currentUser.email}</Info2></Infos>


        {currentUser.role === "admin" ? <Infos><Info>Favourites:</Info><Info2>{currentUser.subscribers}</Info2></Infos> : ""}
        <Btn>
          {edit === false ? <Button onClick={onCall}>Edit</Button> :
            <>
              <Button onClick={handleUpdate}>Update</Button>
              <Button onClick={onCall2}>Cancel</Button>
            </>}
          <Button onClick={() => handleUpdatePassword(currentUser.name)}>Change Password</Button>
          <Button onClick={handleDelete}>Delete</Button>
        </Btn>
      </Details>
    </Container>
  )
}

export default Profile
// export currentUser;