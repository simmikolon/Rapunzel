//
//  RPScene.swift
//  RapunzelSwift
//
//  Created by Simon Kemper on 13.11.15.
//  Copyright © 2015 Simon Kemper. All rights reserved.
//

import SpriteKit

protocol UpdateableNode {
    func update(currentTime: NSTimeInterval)
    func didFinishUpdate()
}

class RPScene: SKScene {

    func setup() {
        
    }
}
