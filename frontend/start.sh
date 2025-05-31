#!/bin/sh

# Start the serve command in the background
serve -s build -l 3000 &

# Keep the container running
tail -f /dev/null 