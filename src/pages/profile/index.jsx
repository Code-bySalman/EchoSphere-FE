import { useAppStore } from "../../store";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { IoArrowBack } from "react-icons/io5";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { FaPlus, FaTrash } from "react-icons/fa";
import { Input } from "@/components/ui/input";
import { profileColors } from "../../lib/utils";
import gsap from "gsap";
import { toast } from "sonner";
import { apiClient } from "../../lib/api-client";
import { SETUP_PROFILE, UPDATE_PROFILE, UPLOAD_IMAGE, DELETE_IMAGE, HOST } from "../../utils/constants";

const Profile = () => {
  const navigate = useNavigate();
  const { userInfo, setUserInfo } = useAppStore();

  const [name, setName] = useState(userInfo?.name || "");
  const [image, setImage] = useState(
    userInfo?.image ? `${HOST}/${userInfo.image.startsWith('/') ? userInfo.image.substring(1) : userInfo.image}` : null
  );
  const [selectedColorIndex, setSelectedColorIndex] = useState(() => {
    return userInfo?.color ? profileColors.indexOf(userInfo.color) : 0;
  });
  const [hovered, setHovered] = useState(false);

  const containerRef = useRef(null);
  const cardRef = useRef(null);
  const backButtonRef = useRef(null);
  const avatarRef = useRef(null);
  const saveButtonRef = useRef(null);

  const getCleanedImagePath = (path) => {
    if (!path) return null;
    return path.startsWith('/') ? path.substring(1) : path;
  };

  useEffect(() => {
    if (
      containerRef.current &&
      cardRef.current &&
      backButtonRef.current &&
      avatarRef.current &&
      saveButtonRef.current
    ) {
      const tl = gsap.timeline();
      tl.fromTo(containerRef.current, { opacity: 0 }, { opacity: 1, duration: 0.8, ease: "power2.out" });
      tl.fromTo(cardRef.current, { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: "back.out(1.4)" }, "-=0.4");
      tl.fromTo(backButtonRef.current, { x: -20, opacity: 0 }, { x: 0, opacity: 1, duration: 0.6, ease: "power2.out" }, "-=0.6");
      tl.fromTo(avatarRef.current, { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6, ease: "elastic.out(1, 0.5)" }, "-=0.6");
      tl.fromTo(saveButtonRef.current, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6, ease: "bounce.out" }, "-=0.4");
    }
  }, []);

  useEffect(() => {
    if (userInfo) {
      setName(userInfo.name || "");
      const colorIndex = profileColors.indexOf(userInfo.color);
      setSelectedColorIndex(colorIndex !== -1 ? colorIndex : 0);

      if (userInfo.image) {
        setImage(`${HOST}/${getCleanedImagePath(userInfo.image)}`);
      } else {
        setImage(null);
      }
      console.log("Profile component mounted/userInfo changed. Current userInfo:", userInfo);
    }
  }, [userInfo]);

  const validateProfile = () => {
    if (!name || name.trim() === "") {
      toast.error("Username is required.");
      return false;
    }
    return true;
  };

  const saveChanges = async () => {
    if (saveButtonRef.current) {
      gsap.to(saveButtonRef.current, {
        scale: 0.95,
        duration: 0.1,
        yoyo: true,
        repeat: 1,
        onComplete: () => {
          if (saveButtonRef.current) {
            gsap.to(saveButtonRef.current, { scale: 1, duration: 0.1 });
          }
        }
      });
    }

    if (!validateProfile()) {
      return;
    }

    const wasProfileInitiallySetup = userInfo?.profileSetup === true;

    try {
      let response;
      const payload = {
        name,
        color: profileColors[selectedColorIndex],
      };

      if (!wasProfileInitiallySetup) {
        response = await apiClient.post(SETUP_PROFILE, payload, { withCredentials: true });
      } else {
        response = await apiClient.post(UPDATE_PROFILE, payload, { withCredentials: true });
      }

      if (response.status === 200 && response.data) {
        setUserInfo({ ...response.data });
        toast.success("Profile updated successfully!");
        navigate("/chat");
      } else {
        toast.error("Failed to update profile. Please try again.");
      }
    } catch (error) {
      console.error("Error during API call (saveChanges):", error);
      if (error.response) {
        toast.error(`Error: ${error.response.data.message || 'Server error'}`);
      } else {
        toast.error("An unexpected error occurred while saving profile.");
      }
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Image size too large. Max 2MB allowed.");
        return;
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Only JPEG, PNG, GIF, and WEBP image files are allowed.");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
        if (avatarRef.current) {
          gsap.fromTo(avatarRef.current, { scale: 0.9, opacity: 0.5 }, { scale: 1, opacity: 1, duration: 0.3 });
        }
      };
      reader.readAsDataURL(file);

      const formData = new FormData();
      formData.append("profileImage", file);

      try {
        const response = await apiClient.post(UPLOAD_IMAGE, formData, {
          withCredentials: true,
        });

        if (response.status === 200 && response.data) {
          setUserInfo({ ...response.data });
          toast.success("Profile image updated successfully!");
        } else {
          toast.error("Failed to upload image. Please try again.");
          setImage(userInfo?.image ? `${HOST}/${getCleanedImagePath(userInfo.image)}` : null);
        }
      } catch (error) {
        console.error("Error during image upload API call:", error);
        toast.error(`Image upload error: ${error.response?.data?.message || 'An error occurred'}`);
        setImage(userInfo?.image ? `${HOST}/${getCleanedImagePath(userInfo.image)}` : null);
      }
    }
  };

  const removeImage = async () => {
    if (avatarRef.current) {
      gsap.to(avatarRef.current, { scale: 0.9, duration: 0.2, yoyo: true, repeat: 1, onComplete: () => gsap.to(avatarRef.current, { scale: 1, duration: 0.1 }) });
    }

    try {
      const response = await apiClient.delete(DELETE_IMAGE, { withCredentials: true });

      if (response.status === 200 && response.data) {
        setUserInfo({ ...response.data });
        toast.success("Profile image removed successfully!");
      } else {
        toast.error("Failed to remove image. Please try again.");
      }
    } catch (error) {
      console.error("Error during image removal API call:", error);
      toast.error(`Image removal error: ${error.response?.data?.message || 'An error occurred'}`);
    }
  };

  return (
    <div
      ref={containerRef}
      className="w-screen h-screen flex items-center justify-center bg-gradient-to-br from-[#1a1a2e] to-[#16213e] overflow-hidden"
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="w-2 h-2 bg-white/20 rounded-full absolute top-[20%] left-[10%] animate-pulse"></div>
        <div className="w-3 h-3 bg-white/20 rounded-full absolute bottom-[30%] right-[15%] animate-pulse delay-100"></div>
        <div className="w-2 h-2 bg-white/20 rounded-full absolute top-[50%] right-[5%] animate-pulse delay-200"></div>
        <div className="w-3 h-3 bg-white/20 rounded-full absolute bottom-[10%] left-[25%] animate-pulse delay-300"></div>
      </div>

      <div
        ref={cardRef}
        className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 sm:p-8 lg:p-10 shadow-xl border border-white/20 flex flex-col gap-6 w-full max-w-md sm:max-w-lg lg:max-w-2xl z-10"
      >
        <div ref={backButtonRef} className="absolute top-4 left-4 z-20">
          <IoArrowBack
            className="text-3xl text-white cursor-pointer hover:text-blue-300 transition-colors duration-300"
            onClick={() => navigate(-1)}
          />
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white text-center mb-4 drop-shadow-md">
          Your Profile
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-center">
          <div
            ref={avatarRef}
            className="h-32 w-32 md:h-48 md:w-48 relative flex items-center justify-center mx-auto"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            <Avatar className="h-full w-full rounded-full overflow-hidden border-4 border-white/30 shadow-md">
              {image ? (
                <AvatarImage src={image} alt="profile" className="object-cover w-full h-full bg-black" />
              ) : (
                <div
                  className="h-full w-full uppercase text-5xl md:text-7xl flex items-center justify-center rounded-full text-white font-bold"
                  style={{ backgroundColor: profileColors[selectedColorIndex] }}
                >
                  {name ? name.charAt(0).toUpperCase() : (userInfo?.email ? userInfo.email.charAt(0).toUpperCase() : '?')}
                </div>
              )}
            </Avatar>
            {hovered && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full cursor-pointer transition-opacity duration-300">
                {image ? (
                  <FaTrash
                    className="text-white text-3xl cursor-pointer hover:scale-110 transition-transform"
                    onClick={removeImage}
                  />
                ) : (
                  <>
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <FaPlus className="text-white text-3xl hover:scale-110 transition-transform" />
                    </label>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4 items-center justify-center w-full">
            <Input
              placeholder="Email"
              value={userInfo?.email || ""}
              disabled
              type="email"
              className="rounded-lg p-4 bg-white/10 text-white placeholder-white/70 border border-white/20 focus:ring-2 focus:ring-blue-400"
            />
            <Input
              placeholder="Name"
              value={name}
              type="text"
              onChange={(e) => setName(e.target.value)}
              className="rounded-lg p-4 bg-white/10 text-white placeholder-white/70 border border-white/20 focus:ring-2 focus:ring-blue-400"
            />
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {profileColors.map((color, index) => (
                <button
                  key={index}
                  className={`w-6 h-6 rounded-full cursor-pointer transition-transform duration-300 ${
                    selectedColorIndex === index ? "ring-2 ring-blue-400 ring-offset-2" : ""
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setSelectedColorIndex(index)}
                  id={`color-${index}`}
                />
              ))}
            </div>
            <button
              ref={saveButtonRef}
              onClick={saveChanges}
              className="mt-6 bg-blue-700 hover:bg-blue-400 text-white font-semibold py-2 px-6 rounded-lg shadow-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;