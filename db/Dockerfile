FROM postgres:15

RUN apt-get update \
    && apt-get install -y --no-install-recommends jq \
    && rm -rf /var/lib/apt/lists/*

COPY docker-entrypoint-wrap.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint-wrap.sh

ENTRYPOINT ["docker-entrypoint-wrap.sh"]
CMD ["postgres"]
