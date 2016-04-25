void main(void) {
    
    vec4 sum = vec4(0.0);
    int x ;
    int y ;
    vec4 color = texture2D(u_texture,v_tex_coord);
    
    for (x = -2; x<= 2; x++) {
        for (y = -2; y<= 2; y++) {
            vec2 offset = vec2(x,y) * 0.005 ;
            sum += texture2D(u_texture,v_tex_coord + offset);
        }
    }
    
    
    gl_FragColor = ( sum / 5.0 ) + color;
}