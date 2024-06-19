FROM registry.access.redhat.com/ubi9/ubi-minimal:9.4-949
ARG PKGS="jq git tar gettext java-21-openjdk nodejs nodejs-nodemon nodejs-full-i18n npm findutils which podman"
ARG OC_VERSION="4.15.11"
ARG HELM_VERSION="3.13.2"
ARG YQ_VERSION="v4.41.1"
ARG MAVEN_VERSION="3.8.8"
ARG NODEJS_VERSION="20"
ARG S2I_VERSION="v1.4.0"
ENV MAVEN_OPTS="-Duser.home=/tmp/maven" \
    MAVEN_HOME="/opt/maven" M2_HOME="/opt/maven" \
    PATH=/opt/maven/bin:${PATH} \
    npm_config_cache=/tmp/.npm
RUN microdnf update -y && microdnf -y module disable nodejs && \
    microdnf -y module enable nodejs:$NODEJS_VERSION && microdnf install -y $PKGS && \
    curl -L  https://github.com/mikefarah/yq/releases/download/${YQ_VERSION}/yq_linux_amd64 -o /usr/bin/yq && \
    chmod +x /usr/bin/yq && \
    curl -L https://mirror.openshift.com/pub/openshift-v4/clients/ocp/${OC_VERSION}/openshift-client-linux-${OC_VERSION}.tar.gz -o /tmp/oc.tar.gz && \
    curl -L https://developers.redhat.com/content-gateway/file/pub/openshift-v4/clients/helm/${HELM_VERSION}/helm-linux-amd64.tar.gz -o /tmp/helm.tar.gz && \
    curl -L https://downloads.apache.org/maven/maven-3/${MAVEN_VERSION}/binaries/apache-maven-${MAVEN_VERSION}-bin.tar.gz -o /tmp/maven.tar.gz && \
    curl -L https://github.com/openshift/source-to-image/releases/download/${S2I_VERSION}/source-to-image-${S2I_VERSION}-d3544c7e-linux-amd64.tar.gz -o /tmp/s2i.tar.gz && \
    tar -zxvf /tmp/oc.tar.gz -C /tmp &&  tar -zxvf /tmp/helm.tar.gz -C /tmp && mv /tmp/helm-linux-amd64 /tmp/helm && \
    tar -xvzf /tmp/s2i.tar.gz -C /tmp && tar -zxvf /tmp/maven.tar.gz -C /opt && \
    mv /tmp/oc /tmp/kubectl /tmp/helm /tmp/s2i /usr/local/bin && chmod +x /usr/local/bin/oc /usr/local/bin/helm /usr/local/bin/kubectl /usr/local/bin/s2i && \
    ln -s /opt/apache-maven-${MAVEN_VERSION} /opt/maven && \
    microdnf clean all && rm -rf /tmp/* && chmod 1777 /tmp 
USER 1001
