//
//  Pattern.swift
//  Rapunzel
//
//  Created by Simon Kemper on 25.04.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

class Pattern {
    
    var beats: [Beat]
    var cursor: Int = 0
    private var numberOfBeats: Int = 0
    
    var lowerCursor: Int = 0
    
    init(withNumberOfBeats numberOfBeats: Int = 16) {
        
        beats = Array(count: numberOfBeats, repeatedValue: Beat(withType: .Empty))
        self.numberOfBeats = numberOfBeats
    }
    
    func increaseCursor() {
        cursor += 1
        if cursor >= numberOfBeats { cursor = 0 }
    }
    
    func decreaseCursor() {
        cursor -= 1
        if cursor < 0 { cursor = numberOfBeats-1 }
    }
    
    func increaseLowerCursor() {
        lowerCursor += 1
        if lowerCursor >= numberOfBeats { lowerCursor = 0 }
    }
    
    func decreaseLowerCursor() {
        lowerCursor -= 1
        if lowerCursor < 0 { lowerCursor = numberOfBeats-1 }
    }
}
