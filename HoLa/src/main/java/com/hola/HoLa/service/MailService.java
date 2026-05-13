package com.hola.HoLa.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class MailService {

    @Autowired
    private JavaMailSender mailSender;

    public void send(String to, String otp) {

        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setTo(to);
        msg.setSubject("[HoLa] Ma OTP cua ban la "+otp);
        msg.setText("Ma OTP cua ban la: "+otp+"\nMa co hieu luc trong 2 phut. Vui long khong chia se ma nay voi bat ky ai");

        mailSender.send(msg);
    }
}
