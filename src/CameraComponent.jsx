import React, {useEffect, useRef, useState} from 'react';
import photoIcon from './Assets/images/camera.png';
import videoIcon from './Assets/images/video.png';
import startRecordIcon from './Assets/images/record.png';
import stopRecordIcon from './Assets/images/stop-button.png';
import deleteIcon from './Assets/images/bin.png';
import takePhotoIcon from './Assets/images/diaphragm.png';
import playVideoIcon from './Assets/images/play.png';
import recIcon from './Assets/images/rec-button.png';
import '../src/index.css';

const CameraComponent = ({width, height, facingMode, enableAudio = true, acceptRatio}) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const videoPlayBackRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const recordedChunksRef = useRef([]);
    const playVideoPlayBack = useRef([]);

    const [stream, setStream] = useState(null);
    const [recorder, setRecorder] = useState(null);
    const [recordedChunks, setRecordedChunks] = useState([]);
    const [isRecording, setIsRecording] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [videoUrl, setVideoUrl] = useState(null);
    const [photoUrl, setPhotoUrl] = useState(null);
    const [showRecordingVideo, setShowRecordingVideo] = useState(false);
    const [showBtnPlay, setShowBtnPlay] = useState(false);
    const [showRecordingPhoto, setShowRecordingPhoto] = useState(false);
    const [cameraMode, setCameraMode] = useState("video"); // photo

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
            startCamera().then(() => {
            })
        };
    }, []);

    const stopCamera = () => {
        if (stream) {
            const tracks = stream.getTracks();
            tracks.forEach(track => track.stop());
            setStream(null);
            setRecorder(null);
            setRecordedChunks([])
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
            setShowBtnPlay(true)
        }
    };

    const playVideo = () => {
        setIsPlaying(true);
        videoPlayBackRef.current.src = videoUrl;
        videoPlayBackRef.current.controls = true;
        videoPlayBackRef.current.play();
        setShowBtnPlay(false)
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
        setPhotoUrl(photoUrl);
        setShowRecordingPhoto(true)
    };

    const deletePhoto = () => {
        setShowRecordingPhoto(false);
        stopCamera();
        startCamera();
        setPhotoUrl(null);
    };

    return (
        <div className="rc-camera-js-container" style={{width: width, height: height}}>
            {/*            <button onClick={startCamera} disabled={stream}>Start Camera</button>
                <button onClick={stopCamera} disabled={!stream}>Stop Camera</button>*/}

            {isRecording && <img src={recIcon} width={30} height={30} alt="recording"
                                 style={{position: "absolute", top: 20, left: 20}}/>}

            <div className="action-controller-container">
                <button className="button-control-style" onClick={() => {
                    setIsPlaying(false);
                    setVideoUrl(null);
                    setShowRecordingVideo(false)
                    stopCamera()
                    startCamera()
                    setCameraMode(v => v === "photo" ? "video" : "photo")
                }}>
                    {cameraMode === "video" ? <img src={photoIcon} width={35} height={35}/> :
                        <img src={videoIcon} width={35} height={35}/>}
                </button>
                {
                    cameraMode === "video" ?
                        <div style={{display: 'flex'}}>
                            <button className="button-control-style" onClick={startRecording}
                                    disabled={isRecording || showRecordingVideo}>
                                <img width={35} height={35} src={startRecordIcon} alt="startRecord"/>
                            </button>
                            <button className="button-control-style" onClick={stopRecording} disabled={!isRecording}>
                                <img width={35} height={35} src={stopRecordIcon} alt="stopRecord"/>
                            </button>
                            <button className="button-control-style" onClick={resetVideo}
                                    disabled={!showRecordingVideo}>
                                <img width={35} height={35} src={deleteIcon} alt="delete"/>
                            </button>
                        </div>
                        : <div style={{display: 'flex'}}>
                            <button className="button-control-style" onClick={takePhoto}
                                    disabled={isRecording || isPlaying || !stream || photoUrl}>
                                <img width={35} height={35} src={takePhotoIcon} alt="takePhoto"/>
                            </button>
                            <button className="button-control-style" onClick={deletePhoto}
                                    disabled={isRecording || isPlaying || !showRecordingPhoto}>
                                <img width={35} height={35} src={deleteIcon} alt="delete"/>
                            </button>
                        </div>
                }
            </div>

            {
                showRecordingVideo && showBtnPlay &&
                <button className="button-play-style"
                        ref={playVideoPlayBack} onClick={playVideo}
                        disabled={!showRecordingVideo}>
                    <img src={playVideoIcon} width={100} height={100}/>
                </button>
            }

            {
                !showRecordingVideo && !showRecordingPhoto &&
                <video ref={videoRef}
                       width="100%"
                       height="100%"
                       className="sajjad"
                       muted={!enableAudio}
                       disablePictureInPicture={true}
                       style={{display: stream ? 'block' : 'none'}}
                       autoPlay playsInline/>
            }
            {
                showRecordingVideo &&
                <video ref={videoPlayBackRef} width="100%"
                       height="100%" disablePictureInPicture
                       autoPlay playsInline style={{backgroundColor: "black"}} controls={false}/>
            }
            <canvas ref={canvasRef} width={width} height={height}
                    style={{display: 'none'}}/>
            {photoUrl && <img width="100%"
                              height="100%"
                              src={photoUrl} alt="Photo"/>}
        </div>
    );
};

export default CameraComponent;
