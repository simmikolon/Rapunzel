//
//  RPPattern.swift
//  Rapunzel
//
//  Created by Simon Kemper on 25.04.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

class RPPattern {
    
    var beats: [RPBeat]
    var cursor: Int = 0
    private var numberOfBeats: Int = 0
    
    init(withNumberOfBeats numberOfBeats: Int = 16) {
        
        beats = Array(count: numberOfBeats, repeatedValue: RPBeat(withType: .Empty))
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
}
