import React, { useEffect, useRef, useState } from 'react';
import videojs from 'video.js';

const Player = ({ videoUrl, onClosePlayer }) => {
  const playerRef = useRef(null);
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);

  useEffect(() => { //no entiendo ni yo apartir de aquí 
    const calculateScale = () => {
      if (containerRef.current) {
        const containerHeight = containerRef.current.clientHeight;
        const targetHeight = containerHeight / 0.8;
        const scaleY = targetHeight / containerHeight;
        return scaleY;
      }
      return 1;
    };

    const updateScale = () => {
      setScale(calculateScale());
    };

    const timer = setTimeout(updateScale, 0);

    window.addEventListener('resize', updateScale);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateScale);
    };
  }, []);

  useEffect(() => {
    const initializePlayer = (url) => {
      if (playerRef.current) {
        const player = videojs(playerRef.current, {
          autoplay: false,
          controls: true,
          sources: [{ src: url, type: "video/mp4" }],
          controlBar: {
            playToggle: true,
            volumePanel: true,
            currentTimeDisplay: true,
            timeDivider: true,
            durationDisplay: true,
            progressControl: true,
            fullscreenToggle: false
          }
        });

        
      }
    };

    const fetchVideoUrl = async () => {
      initializePlayer("/.proxy/watch/watch/"+videoUrl);
    };

    fetchVideoUrl();
  }, [videoUrl, onClosePlayer]);

  return (
    <div className="w-full h-full flex items-center justify-center">
      <link href="video-js.css" rel="stylesheet" />
      <div data-vjs-player className="w-4xl h-4xl">
        <video ref={playerRef} className="video-js vjs-default-skin vjs-big-play-centered" />
      </div>
    </div>
  );
};

export default Player;