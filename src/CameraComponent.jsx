import React, {useEffect, useRef, useState} from 'react';

const CameraComponent = ({width, height, facingMode, enableAudio = true, acceptRatio}) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const videoPlayBackRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const recordedChunksRef = useRef([]);

    const [stream, setStream] = useState(null);
    const [recorder, setRecorder] = useState(null);
    const [recordedChunks, setRecordedChunks] = useState([]);
    const [isRecording, setIsRecording] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [videoUrl, setVideoUrl] = useState(null);
    const [photoUrl, setPhotoUrl] = useState(null);
    const [showRecordingVideo, setShowRecordingVideo] = useState(false);
    const [showRecordingPhoto, setShowRecordingPhoto] = useState(false);
    const [cameraMode, setCameraMode] = useState("photo"); // video

    console.log("sajjad: ", {
        stream,
        recorder,
        recordedChunks,
        isRecording,
        isPlaying,
        videoUrl,
        photoUrl,
        showRecordingVideo,
        showRecordingPhoto
    })

    const handleDataAvailable = (event) => {
        if (event.data.size > 0) {
            recordedChunksRef.current.push(event.data);
        }
    };

    const startCamera = async () => {
        try {
            const constraints = {video: {facingMode}};
            if (enableAudio) {
                constraints.audio = true;
            }
            if (acceptRatio) {
                constraints.video.aspectRatio = acceptRatio;
            }
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                navigator.mediaDevices.getUserMedia(constraints)
                    .then((stream) => {
                        videoRef.current.srcObject = stream;
                        mediaRecorderRef.current = new MediaRecorder(stream);
                        mediaRecorderRef.current.ondataavailable = handleDataAvailable;
                        mediaRecorderRef.current.onstop = stopRecording;

                        videoRef.current.srcObject = stream;
                        setStream(stream);
                    })
                    .catch((error) => {
                        console.error('Error accessing camera:', error);
                    });
            }
        } catch (error) {
            console.error('Error accessing camera:', error);
        }
    };

    useEffect(() => {
        return () => {
            startCamera()
        };
    }, []);

    const stopCamera = () => {
        if (stream) {
            const tracks = stream.getTracks();
            tracks.forEach(track => track.stop());
            setStream(null);
            setRecorder(null);
        }
    };

    const startRecording = () => {
        if (stream) {
            const mediaRecorder = new MediaRecorder(stream);
            const chunks = [];
            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunks.push(e.data);
                }
            };
            mediaRecorder.onstop = () => {
                setRecordedChunks(chunks);
                setIsRecording(false);
                const blob = new Blob(chunks, {type: chunks[0].type});
                const videoUrl = URL.createObjectURL(blob);
                setVideoUrl(videoUrl);
            };
            mediaRecorder.start();
            setIsRecording(true);
            setRecorder(mediaRecorder);
        }
    };

    const stopRecording = () => {
        if (recorder) {
            recorder.stop();
            const recordedBlob = new Blob(recordedChunksRef.current, {type: 'video/webm'});
            const videoUrl = URL.createObjectURL(recordedBlob);
            setVideoUrl(videoUrl);
            setShowRecordingVideo(true);
        }
    };

    const takeNewVideo = () => {
        setShowRecordingVideo(false);
        setRecorder(null)
        setIsPlaying(false);
        setVideoUrl(null);
        setShowRecordingVideo(false)
        stopCamera()
        startCamera()
    }

    const playVideo = () => {
        setIsPlaying(true);
        videoPlayBackRef.current.src = videoUrl;
        videoPlayBackRef.current.play();
    };

    const resetVideo = () => {
        setIsPlaying(false);
        videoPlayBackRef.current.src = '';
        setVideoUrl(null);
        setShowRecordingVideo(false)
        stopCamera()
        startCamera()
    };

    const takePhoto = () => {
        const context = canvasRef.current.getContext('2d');
        context.drawImage(videoRef.current, 0, 0, width, height);
        const photoUrl = canvasRef.current.toDataURL('image/png');
        setShowRecordingPhoto(true)
        setPhotoUrl(photoUrl);
    };

    const deletePhoto = () => {
        setShowRecordingPhoto(false);
        stopCamera();
        startCamera();
        setPhotoUrl(null);
    };

    return (
        <div>
            <button onClick={startCamera} disabled={stream}>Start Camera</button>
            <button onClick={stopCamera} disabled={!stream}>Stop Camera</button>
            <button onClick={() => {
                setCameraMode(v => v === "photo" ? "video" : "photo")
            }}>
                {cameraMode === "video" ? "change to photo" : "change to video"}
            </button>
            {
                cameraMode === "video" &&
                <div>
                    <button onClick={startRecording} disabled={isRecording || !stream}>
                        {isRecording ? 'Recording...' : 'Start Recording'}
                    </button>
                    <button onClick={stopRecording} disabled={!isRecording}>
                        Stop Recording
                    </button>
                    {/*                    <button onClick={takeNewVideo} disabled={isRecording}>
                        new video
                    </button>*/}
                    <button onClick={playVideo} disabled={!showRecordingVideo}>Play Video</button>
                    <button onClick={resetVideo} disabled={!showRecordingVideo}>deleted Video</button>
                </div>
            }
            {
                cameraMode === "photo" &&
                <div>
                    <button onClick={takePhoto} disabled={isRecording || isPlaying || !stream}>
                        Take Photo
                    </button>
                    <button onClick={deletePhoto} disabled={isRecording || isPlaying || !showRecordingPhoto}>
                        Delete Photo
                    </button>
                </div>
            }

            {
                !showRecordingVideo && !showRecordingPhoto &&
                <video ref={videoRef}
                       width={width}
                       height={height}
                       muted={!enableAudio}
                       disablePictureInPicture={true}
                       style={{display: stream ? 'block' : 'none'}}
                       autoPlay playsInline/>
            }
            {
                showRecordingVideo &&
                <video ref={videoPlayBackRef} width={width} height={height} disablePictureInPicture
                       autoPlay playsInline style={{backgroundColor: "black"}} controls={true}/>
            }
            <canvas ref={canvasRef} width={width} height={height} style={{display: 'none'}}/>
            {photoUrl && <img src={photoUrl} alt="Taken Photo"/>}
        </div>
    );
};

export default CameraComponent;
