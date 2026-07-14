package com.skydrive.skydrive.service;

import java.io.InputStream;
import java.net.Socket;
import java.nio.ByteBuffer;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.skydrive.skydrive.config.ClamAvConfig;
import com.skydrive.skydrive.exception.VirusDetectedException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class VirusScanService {

    private final ClamAvConfig config;
    
    public void scan(MultipartFile file) throws Exception {
        try (InputStream is = file.getInputStream()) {
            scan(is);
        }
    }

    public void scan(InputStream input) throws Exception {
        try(
            Socket socket = new Socket( config.getHost() , config.getPort());
        ){
            socket.getOutputStream()
                .write("zINSTREAM\0".getBytes());

            byte[] buffer= new byte[2048];

            int read;

            while((read = input.read(buffer)) != -1){
                byte[] size = ByteBuffer.allocate(4)
                            .putInt(read)
                            .array();
                
                socket.getOutputStream()
                        .write(size);
                
                socket.getOutputStream()
                        .write(buffer, 0, read);
            }

            socket.getOutputStream().write(new byte[]{0,0,0,0});

            socket.getOutputStream().flush();

            byte[] response = socket.getInputStream().readAllBytes();

            String result = new String(response);

            if(result.contains("FOUND")){
                throw new VirusDetectedException(result);
            }
        }
    }
}
