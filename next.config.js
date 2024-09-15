module.exports = {
    async headers() {
        return [
            {
                source: '/pyodide/(.*)\.(whl|zip|wasm|js)',
                headers: [
                    {
                        key: 'cache-control',
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            }
        ]
    },
}