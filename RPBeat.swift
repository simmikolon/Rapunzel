//
//  RPBeat.swift
//  Rapunzel
//
//  Created by Simon Kemper on 25.04.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

enum RPBeatType {
    case Empty
    case NotEmpty
}

struct RPBeat {
    
    var elements: [RPBeatElement]
    let type: RPBeatType
    
    init(withType type: RPBeatType = .Empty) {
        
        elements = []
        self.type = type
    }
}