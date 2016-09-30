FROM ubuntu:16.04

RUN apt-get update -y

RUN apt-get install -y python3 python3-pip  nginx supervisor git


RUN mkdir -p /deploy/texts_viewer
COPY . /deploy/texts_viewer
RUN pip3 install -r /deploy/texts_viewer/requirements.txt
RUN pip3 install gunicorn
RUN pip3 install git+https://github.com/jfinkels/flask-restless.git


# Setup nginx
RUN rm /etc/nginx/sites-enabled/default
COPY docker_conf/flask.conf /etc/nginx/sites-available/
RUN ln -s /etc/nginx/sites-available/flask.conf /etc/nginx/sites-enabled/flask.conf
RUN echo "daemon off;" >> /etc/nginx/nginx.conf

# Setup supervisord
RUN mkdir -p /var/log/supervisor
COPY docker_conf/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY docker_conf/gunicorn.conf /etc/supervisor/conf.d/gunicorn.conf


# Start processes
CMD ["/usr/bin/supervisord"]
