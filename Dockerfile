FROM php:8.2-apache-bookworm

RUN apt-get update && apt-get install -y --no-install-recommends \
    libaio1 \
    unzip \
    wget \
    ca-certificates && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /opt/oracle
RUN wget https://download.oracle.com/otn_software/linux/instantclient/2112000/instantclient-basic-linux.x64-21.12.0.0.0dbru.zip && \
    wget https://download.oracle.com/otn_software/linux/instantclient/2112000/instantclient-sdk-linux.x64-21.12.0.0.0dbru.zip && \
    unzip instantclient-basic-linux.x64-21.12.0.0.0dbru.zip && \
    unzip instantclient-sdk-linux.x64-21.12.0.0.0dbru.zip && \
    rm -f *.zip && \
    echo /opt/oracle/instantclient_21_12 > /etc/ld.so.conf.d/oracle-instantclient.conf && \
    ldconfig

# PDO_OCI (lo que usa conexion.php) + OCI8
RUN docker-php-source extract && \
    docker-php-ext-configure pdo_oci --with-pdo-oci=instantclient,/opt/oracle/instantclient_21_12,21.1 && \
    docker-php-ext-install pdo_oci && \
    echo "instantclient,/opt/oracle/instantclient_21_12" | pecl install oci8 && \
    docker-php-ext-enable oci8 && \
    docker-php-source delete

RUN a2enmod rewrite
COPY . /var/www/html/
RUN chown -R www-data:www-data /var/www/html

# Wallet de Oracle: sqlnet.ora fijo; cwallet.sso se recibe por variable de entorno (base64)
ENV TNS_ADMIN=/opt/wallet
RUN mkdir -p /opt/wallet && \
    printf 'WALLET_LOCATION = (SOURCE = (METHOD = file) (METHOD_DATA = (DIRECTORY="/opt/wallet")))\nSSL_SERVER_DN_MATCH=yes\n' > /opt/wallet/sqlnet.ora && \
    chmod -R a+rX /opt/wallet

# Render indica el puerto con PORT; aquí también se reconstruye el wallet al arrancar
CMD ["sh", "-c", "echo \"$WALLET_SSO_B64\" | base64 -d > /opt/wallet/cwallet.sso && chmod a+r /opt/wallet/cwallet.sso && sed -i \"s/80/${PORT:-80}/g\" /etc/apache2/ports.conf /etc/apache2/sites-available/000-default.conf && apache2-foreground"]
