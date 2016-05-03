//
//  RPEntityManagerComponent.swift
//  Rapunzel
//
//  Created by Simon Kemper on 01.05.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import SpriteKit
import GameplayKit

class RPEntityManagerComponent: GKComponent, RPPlatformEntityDelegate {
    
    var entities = [RPPlatformEntity]()
    
    override func updateWithDeltaTime(seconds: NSTimeInterval) {
        
        super.updateWithDeltaTime(seconds)
    
        for entity in entities {
            entity.updateWithDeltaTime(seconds)
        }
    }
    
    func didRemovePlatform(platform: RPPlatformEntity) {
        //let index = entities.indexOf(platform)
        //entities.removeAtIndex(index!)
    }
}