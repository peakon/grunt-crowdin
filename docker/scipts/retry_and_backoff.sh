#!/bin/bash

CURRENT_RETRY=1
MAX_RETRIES=${MAX_RETRIES:-3}
BACKOFF_TIME=${BACKOFF_TIME:-15}
MAX_TIMEOUT=${MAX_TIMEOUT:-240}

if [ -f /usr/bin/timeout ] ; then
  COMMAND="timeout $MAX_TIMEOUT $@"
else
  COMMAND="$@"
fi

until [ $CURRENT_RETRY -ge ${MAX_RETRIES} ]; do
  # Run the command until it succeeds, breaking out if it does
  sh -c "${COMMAND}" && CURRENT_RETRY=0 && break

  # Backoff and retry
  WAIT_TIME=$(( CURRENT_RETRY++ * ${BACKOFF_TIME}))
  echo "Backing off for ${WAIT_TIME} seconds before retrying"
  sleep $WAIT_TIME
done

exit ${CURRENT_RETRY}
