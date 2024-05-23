FROM registry.access.redhat.com/ubi8/ubi-minimal:8.9-1161
ARG PKGS="jq git tar gettext"
ARG OC_VERSION="4.15.11"
ARG HELM_VERSION="3.13.2"
ARG YQ_VERSION="v4.41.1"
RUN microdnf install -y $PKGS && \
    curl -L  https://github.com/mikefarah/yq/releases/download/${YQ_VERSION}/yq_linux_amd64 -o /usr/bin/yq && \
    chmod +x /usr/bin/yq && \
    curl -L https://mirror.openshift.com/pub/openshift-v4/clients/ocp/${OC_VERSION}/openshift-client-linux-${OC_VERSION}.tar.gz -o /tmp/oc.tar.gz && \
    curl -L https://developers.redhat.com/content-gateway/file/pub/openshift-v4/clients/helm/${HELM_VERSION}/helm-linux-amd64.tar.gz -o /tmp/helm.tar.gz && \
    tar -zxvf /tmp/oc.tar.gz -C /tmp &&  tar -zxvf /tmp/helm.tar.gz -C /tmp && mv /tmp/helm-linux-amd64 /tmp/helm && \
    mv /tmp/oc /tmp/kubectl /tmp/helm /usr/local/bin && chmod +x /usr/local/bin/oc /usr/local/bin/helm /usr/local/bin/kubectl && \
    microdnf clean all && rm -rf /tmp/*
USER 1001