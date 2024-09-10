import React, {useEffect, useRef, useState} from 'react';
import { faQuestion } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import './Tooltip.css';
import { HelpContents } from './HelpContents';

type PropTypes = {
    children: string,
}

// Question mark icons that display information when hovered
const Tooltip = ({
    children
}: PropTypes) => {
    const [active, setActive] = useState(false);
    const [delayHandler, setDelayHandler]: [any, Function] = useState(null);
    const tooltipContainer = useRef<HTMLElement>(null);
    const tooltipContent = useRef<HTMLElement>(null);

    // Determines the position of the tooltip
    useEffect(() => {
        let tempContainer;
        if (tooltipContainer && tooltipContainer.current) {
            tempContainer = tooltipContainer.current;
        } else {
            return;
        }

        let tempContent;
        if (tooltipContent && tooltipContent.current) {
            tempContent = tooltipContent.current;
        } else {
            return;
        }

        let containerRect = tooltipContainer.current.getBoundingClientRect();
        let contentRect = tooltipContent.current.getBoundingClientRect();
        
        // tooltipRect.top < window.innerHeight - tooltipRect.bottom

        if ((containerRect.top > window.innerHeight - containerRect.bottom &&
            window.innerHeight - containerRect.bottom > contentRect.height) ||
            containerRect.top < contentRect.height) {
            tooltipContent.current.style.top = '50%';
            tooltipContent.current.style.bottom = '';
        } else {
            tooltipContent.current.style.top = '';
            tooltipContent.current.style.bottom = '50%';
        }

        if ((containerRect.left > window.innerWidth - containerRect.right &&
            window.innerWidth - containerRect.right > contentRect.width) ||
            containerRect.left < contentRect.width) {
            tooltipContent.current.style.left = '50%';
            tooltipContent.current.style.right = '';
        } else {
            tooltipContent.current.style.left = '';
            tooltipContent.current.style.right = '50%';
        }

    }, [active]);

    // On hover displays tooltip after a delay
    const handleMouseEnter = () => {
        setDelayHandler(setTimeout(() => {
            setActive(true)
        }, 500))
    }

    // On mouse leave, cancels delay and hides tooltip
    const handleMouseLeave = () => {
        clearTimeout(delayHandler)
        setActive(false)
    }

    const tooltipStyle = {
        display: (active)? 'block': 'none'
    }

    return (
        <div 
            ref={tooltipContainer}
            className={`tooltip__container`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <FontAwesomeIcon 
                className='tooltip__icon'
                icon={faQuestion}
            />
            <span className='tooltip__content' style={tooltipStyle} ref={tooltipContent}>
                {children}
            </span>
        </div>
    );
}

export default Tooltip;