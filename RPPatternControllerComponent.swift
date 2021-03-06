//
//  RPPatternControllerComponent.swift
//  Rapunzel
//
//  Created by Simon Kemper on 24.04.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import SpriteKit
import GameplayKit

struct RPPatternSettings {
    
    static let elementsPerBeat: Int = 5
    static let lengthOfBeat: CGFloat = 300
}

class RPPatternControllerComponent: GKComponent {
    
    unowned let renderComponent: SKNode
    unowned let layerEntity: RPLayerEntity
    
    var offset: CGFloat = 0
    var pattern: RPPattern
    
    var upperBeat: Int = 0
    var lowerBeat: Int = 0
    
    private var lastScrollingDelta: CGFloat = 0

    init(withLayerEntity layerEntity: RPLayerEntity, pattern: RPPattern) {
        
        self.renderComponent = layerEntity.parallaxScrollingComponent.cameraComponent.cameraNode.parent!
        self.layerEntity = layerEntity
        self.pattern = pattern
        
        super.init()
        
        createStartupPatternBeats()
    }
    
    func addBeat() {
        
        let beat = pattern.beats[pattern.cursor]
        
        if beat.type != .Empty {
            
            for element in beat.elements {
                element.creationHandler(offset: offset, layerEntity: layerEntity)
            }
        }
        
        pattern.increaseCursor()
        offset += RPPatternSettings.lengthOfBeat
    }
    
    func createStartupPatternBeats() {
        
        let screenSize = CGSize(width: RPGameSceneSettings.width, height: RPGameSceneSettings.height)
        
        while offset < screenSize.height { addBeat() }
        
        addBeat()
    }
    
    func didScrollUpOneBeat() {
        addBeat()
    }
    
    func didScrollDownOneBeat() {
    }

    // MARK: - Lifecycle
    
    override func updateWithDeltaTime(seconds: NSTimeInterval) {
        super.updateWithDeltaTime(seconds)
        
        let scrollingDelta = renderComponent.scene?.convertPoint(renderComponent.position, fromNode: renderComponent.parent!)
    
        if scrollingDelta!.y - lastScrollingDelta < -RPPatternSettings.lengthOfBeat {
            didScrollUpOneBeat()
            lastScrollingDelta = scrollingDelta!.y
        }
        
        else if scrollingDelta!.y - lastScrollingDelta > RPPatternSettings.lengthOfBeat {
            didScrollDownOneBeat()
            lastScrollingDelta = scrollingDelta!.y
        }
    }
}
