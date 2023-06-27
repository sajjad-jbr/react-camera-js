import React from 'react';
import CameraComponent from './CameraComponent';

const App = () => {
    return (
        <div>
            <h1>Camera Example</h1>
            <CameraComponent
                width={640}
                height={480}
                facingMode="user"
                aspectRatio="1.5:1"
                enableAudio={true}/> {/* Audio enabled */}
            {/*<CameraComponent width={640} height={480} facingMode="environment" enableAudio={false} /> /!* Audio disabled *!/*/}
        </div>
    );
};

export default App;
