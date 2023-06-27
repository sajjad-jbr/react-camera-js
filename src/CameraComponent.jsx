import React, { useRef, useState } from 'react';

const CameraComponent = ({ width, height, facingMode, enableAudio = true, acceptRatio }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [recorder, setRecorder] = useState(null);
    const [recordedChunks, setRecordedChunks] = useState([]);
    const [isRecording, setIsRecording] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [videoUrl, setVideoUrl] = useState(null);
    const [photoUrl, setPhotoUrl] = useState(null);

    const startCamera = async () => {
        try {
            const constraints = { video: { facingMode } };
            if (enableAudio) {
                constraints.audio = true;
            }
            if (acceptRatio) {
                constraints.video.aspectRatio = acceptRatio;
            }
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            videoRef.current.srcObject = stream;
            setStream(stream);
        } catch (error) {
            console.error('Error accessing camera:', error);
        }
    };

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
                const blob = new Blob(chunks, { type: chunks[0].type });
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
        }
    };

    const playVideo = () => {
        setIsPlaying(true);
        videoRef.current.src = videoUrl;
        videoRef.current.play();
    };

    const resetVideo = () => {
        setIsPlaying(false);
        videoRef.current.src = '';
        setVideoUrl(null);
    };

    const takePhoto = () => {
        const context = canvasRef.current.getContext('2d');
        context.drawImage(videoRef.current, 0, 0, width, height);
        const photoUrl = canvasRef.current.toDataURL('image/png');
        setPhotoUrl(photoUrl);
    };

    return (
        <div>
            <button onClick={startCamera}>Start Camera</button>
            <button onClick={stopCamera}>Stop Camera</button>
            <button onClick={startRecording} disabled={isRecording}>
                {isRecording ? 'Recording...' : 'Start Recording'}
            </button>
            <button onClick={stopRecording} disabled={!isRecording}>
                Stop Recording
            </button>
            {recordedChunks.length > 0 && !isRecording && (
                <>
                    {!isPlaying ? (
                        <button onClick={playVideo}>Play Video</button>
                    ) : (
                        <button onClick={resetVideo}>Reset Video</button>
                    )}
                </>
            )}
            <button onClick={takePhoto} disabled={isRecording || isPlaying}>
                Take Photo
            </button>
            <video ref={videoRef} width={width} height={height} muted={!enableAudio} autoPlay playsInline />
            <canvas ref={canvasRef} width={width} height={height} style={{ display: 'none' }} />
            {photoUrl && <img src={photoUrl} alt="Taken Photo" />}
        </div>
    );
};

export default CameraComponent;
