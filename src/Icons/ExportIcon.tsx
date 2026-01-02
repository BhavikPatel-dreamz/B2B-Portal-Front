import React from 'react'

interface IconProps {
    size: number;
    className: string;
}
const ExportIcon: React.FC<IconProps> = ({ size, className }) => {
    return (
        <div className={className} style={{ width: size, height: size }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16.1636 13.6896C16.8025 13.2404 17.2816 12.5992 17.5314 11.8592C17.7811 11.1192 17.7886 10.3188 17.5527 9.57427C17.0688 8.04638 15.586 7.20903 13.9835 7.21062H13.0576C12.8366 6.34918 12.4231 5.54909 11.8482 4.8706C11.2732 4.19211 10.5519 3.65289 9.73837 3.29354C8.92487 2.9342 8.04046 2.7641 7.1517 2.79605C6.26295 2.82799 5.39303 3.06115 4.60743 3.47798C3.82184 3.8948 3.14105 4.48442 2.61631 5.20244C2.09158 5.92046 1.73658 6.74817 1.57805 7.62325C1.41952 8.49833 1.46158 9.39798 1.70107 10.2545C1.94057 11.1109 2.37125 11.9019 2.96069 12.5678M9.57731 16.356L9.57411 9.17534M12.1129 13.8173L9.57411 16.356L7.03534 13.8173" stroke="currentColor" strokeWidth="1.59571" strokeLinecap="round" strokeLinejoin="round" />
            </svg>

        </div>
    )
}

export default ExportIcon
