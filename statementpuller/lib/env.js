const commonConfig = {
    defaultViewport: {
        width: 1224,
        height: 768,
        isMobile: false,
    }
};

const driverConfig = {
    pi: {
        headless: true,
        executablePath: '/usr/bin/chromium-browser',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        ...commonConfig
    },
}

module.exports = {
    getCfg: () => {
        if (process.env.PI) {
            return driverConfig.pi;
        }
        return {
            headless: false,
            ...commonConfig,
            //slowMo: 250 // slow down by 250ms
        }
    }
}